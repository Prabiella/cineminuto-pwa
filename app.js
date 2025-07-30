function guardarCupon(cupon) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SAVE_COUPON',
      payload: cupon
    });
    alert("Cupón guardado para uso offline");
  } else {
    alert("No se pudo guardar el cupón");
  }
}