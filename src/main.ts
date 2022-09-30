import axios from 'axios';
import { promises } from 'fs';
import { PushNotificationAction, RingApi } from 'ring-client-api';

async function bootstrap() {
  const refreshTokenBuffer = await promises.readFile('.token');
  const refreshToken = refreshTokenBuffer.toString();
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('undefined webhook url');
    process.exit(1);
  }

  const ringApi = new RingApi({ refreshToken });

  ringApi.onRefreshTokenUpdated.subscribe(({ newRefreshToken }) => {
    console.log('update token');
    void promises.writeFile('.token', newRefreshToken);
  });

  const cameras = await ringApi.getCameras();

  if (cameras.length === 0) {
    console.warn('no camera');
    process.exit(1);
  }

  cameras.forEach((camera) => {
    camera.onNewNotification.subscribe((notification) => {
      if (notification.action === PushNotificationAction.Ding) {
        void axios.post(webhookUrl);
      }
    });
  });
}

void bootstrap();
