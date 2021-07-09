import { WebMercatorViewport } from '@math.gl/web-mercator';
import bbox from '@turf/bbox'

export const getViewportForFeatures = (
  viewport: ConstructorParameters<typeof WebMercatorViewport>[0],
  addressBounds: [number, number, number, number],
  fitBoundsArgs: Parameters<WebMercatorViewport['fitBounds']>[1]
) => {
  // Create a calculator to generate new viewports
  const parsedViewport = new WebMercatorViewport(viewport);
  if (!addressBounds.every(n => n !== Infinity)) return
  const newViewport = parsedViewport.fitBounds(
    bboxToBounds(addressBounds as any),
    fitBoundsArgs
  );
  return newViewport
}

export const bboxToBounds = (n: [number, number, number, number]): [[number, number], [number, number]] => {
  return [[n[0], n[1]], [n[2], n[3]]]
}