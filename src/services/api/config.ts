import Config from 'react-native-config';

export type AppConfig = {
  apiBaseUrl: string;
  sentryDsn: string;
  env: 'development' | 'staging' | 'production';
};

function readEnv(): AppConfig['env'] {
  const value = Config.ENV;
  if (value === 'staging' || value === 'production' || value === 'development') {
    return value;
  }
  return 'development';
}

export const appConfig: AppConfig = {
  apiBaseUrl: Config.API_BASE_URL ?? 'http://10.0.2.2:3000/api/v1',
  sentryDsn: Config.SENTRY_DSN ?? '',
  env: readEnv(),
};
