/** True when WebGL2 or WebGL1 is available. Cheap one-shot probe. */
export const WEBGL_OK: boolean = (() => {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
})();