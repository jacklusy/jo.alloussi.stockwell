/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

import { App } from './src/app/App';
import { bindThemePersistence } from './src/app/bootstrap/bind-theme-persistence';
import { registerDependencies } from './src/app/bootstrap/register-dependencies';
import { initCrashReporting } from './src/services/crash';
import { name as appName } from './app.json';

bindThemePersistence();
registerDependencies();
initCrashReporting();

AppRegistry.registerComponent(appName, () => App);
