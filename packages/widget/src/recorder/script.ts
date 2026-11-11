// The recorder file the script embed inserts from the CDN, built as
// `dist/recorder.iife.js`. It hands its module to the script through a global,
// since a classic script has no exports.
import { startRecording } from "./index.js";
import { RECORDER_GLOBAL } from "./script-loader.js";

Object.assign(window, { [RECORDER_GLOBAL]: { startRecording } });
