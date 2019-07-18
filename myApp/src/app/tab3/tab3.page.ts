import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { GeoJson, FeatureCollection } from '../models/map';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['./tab3.page.scss']
})
export class Tab3Page implements OnInit {

  map: mapboxgl.Map;
  style = 'mapbox://styles/mapbox/streets-v11';
  zoom = 12;
  loadingMap = true;
  location = [0, 0];

  constructor(private geolocation: Geolocation) {
    this.geolocation = geolocation;
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.initMap();
  }

  updateLocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const coords = [resp.coords.longitude, resp.coords.latitude];
      this.location = coords;
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  centerMap(coords) {
    this.map.setCenter(coords);
  }

  initMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const coords = [resp.coords.longitude, resp.coords.latitude];
      this.location = coords;
      this.map = new mapboxgl.Map({
        container: 'map', // container id
        style: this.style, // stylesheet location
        center: coords, // starting position [lng, lat]
        zoom: this.zoom // starting zoom
      });
      this.loadingMap = false;
      this.buildMap();
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  buildMap() {
    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.on('click', (event) => {
      const coordinates = [event.lngLat.lng, event.lngLat.lat]
      console.log('Click at: ', coordinates);
    })
    this.map.on('load', (event) => {
      console.log('map loaded!');
      const size = 125;

      const pulsingDot = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),
        map: this.map,
        
        onAdd: function() {
          var canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          this.context = canvas.getContext('2d');
        },
        
        render: function() {
          var duration = 1000;
          var t = (performance.now() % duration) / duration;
          
          var radius = size / 2 * 0.3;
          var outerRadius = size / 2 * 0.7 * t + radius;
          var context = this.context;
          
          // draw outer circle
          context.clearRect(0, 0, this.width, this.height);
          context.beginPath();
          context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
          context.fillStyle = 'rgba(0, 100, 255,' + (0.6 - t) + ')';
          context.fill();
          
          // draw inner circle
          context.beginPath();
          context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
          context.fillStyle = 'rgba(0, 100, 255, 1)';
          context.strokeStyle = 'white';
          context.lineWidth = 2 + 4 * (1 - t);
          context.fill();
          context.stroke();
          
          // update this image's data with data from the canvas
          this.data = context.getImageData(0, 0, this.width, this.height).data;
          
          // keep the map repainting
          this.map.triggerRepaint();
          
          // return `true` to let the map know that the image was updated
          return true;
        }
      };

      console.log(pulsingDot);

      

      this.map.addSource('location', {
        type: 'geojson',
        data: {
            "type": "FeatureCollection",
            "features": [{
              "type": "Feature",
                "geometry": {
                  "type": "Point",
                  "coordinates": this.location
              }
            }]
          }
      });

      this.map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

      this.map.addLayer({
        id: 'location',
        source: 'location',
        type: 'symbol',
        "layout": {
          "icon-image": "pulsing-dot"
        }
      });

      console.log(this.map);


      
  
      // this.map.addLayer({
      //   "id": "points",
      //   "type": "symbol",
      //   "source": {
      //     "type": "geojson",
      //     "data": {
      //       "type": "FeatureCollection",
      //       "features": [{
      //         "type": "Feature",
      //         "geometry": {
      //           "type": "Point",
      //           "coordinates": [0, 0]
      //         }
      //       }]
      //     }
      //   },
      //   "layout": {
      //   "icon-image": "pulsing-dot"
      //   }
      // });
    });
  }

  flyTo(data: GeoJson) {
    this.map.flyTo({
      center: data.geometry.coordinates
    })
  }
}

