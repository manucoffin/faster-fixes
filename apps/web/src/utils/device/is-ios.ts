export function isIOS() {
  return (
    // Simulators report the device name in the user agent too.
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}
