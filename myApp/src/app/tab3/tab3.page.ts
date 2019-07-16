import { Component, OnInit } from '@angular/core';
import { Map } from 'mapbox-gl';
import { MapboxService } from '../services/mapbox.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit {

  mapboxService: MapboxService;

  map: Map;
  style = 'mapbox://styles/mapbox/streets-v11';
  lat = 13.0569951;
  lng = 80.20929129999999;

  constructor(mapboxService: MapboxService) {
    this.mapboxService = mapboxService;
  }

  ngOnInit() {
    this.map = new Map({
      container: 'map', // container id
      style: this.style, // stylesheet location
      center: [this.lng, this.lat], // starting position [lng, lat]
      zoom: 9 // starting zoom
    });

    this.map.on('load', (event) => {
      this.map.addSource('customMarker', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      const markers = this.mapboxService.getMarkers();

      const data = {
        type: 'FeatureCollection',
        features: markers
      };

      this.map.getSource('customMarker').setData(data);

      this.map.addLayer({
        id: 'customMarketid',
        source: 'customMarker',
        type: 'symbol',
        layout: {
          'text-field': '{message}',
          'text-size': 24,
          'text-transform': 'uppercase',
          'icon-image': 'marker-15',
          'text-offset': [0, 1.5]
        },
        paint: {
          'text-color': '#f16624',
          'text-halo-color': '#fff',
          'text-halo-width': 2
        }
      });
    });
  }
}
