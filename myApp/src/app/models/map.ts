export interface IGeometry {
    type: string;
    coordinates;
}

export interface IGeoJson {
    type: string;
    geometry: IGeometry;
    properties?: any;
    $key?: string;
}

export class GeoJson implements IGeoJson {
  type = 'Feature';
  geometry: IGeometry;

  constructor(type, coordinates, public properties?) {
    this.geometry = {
      type,
      coordinates
    };
  }
}

export class FeatureCollection {
  type = 'FeatureCollection';

  constructor(public features: Array<GeoJson>) {}
}
