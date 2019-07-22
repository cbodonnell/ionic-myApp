import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { GeoJson, FeatureCollection } from '../models/map';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['./tab3.page.scss']
})

export class Tab3Page implements OnInit {

  watch: Observable<Geoposition>;
  location: GeoJson = new GeoJson('Point', [0, 0]);

  map: mapboxgl.Map;
  style = 'mapbox://styles/mapbox/streets-v11';
  zoom = 12;
  loadingMap = true;

  isViewLocked = false;
  isRecording = false;

  path = new GeoJson('LineString', []);

  constructor(private geolocation: Geolocation) {
    this.geolocation = geolocation;
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.watch = this.geolocation.watchPosition({
      enableHighAccuracy: true
    })
    this.initMap();
  }

  initMap() {
    this.geolocation.getCurrentPosition({
        enableHighAccuracy: true
    }).then((resp) => {
      const coords = [resp.coords.longitude, resp.coords.latitude];
      this.location.geometry.coordinates = coords;
      this.map = new mapboxgl.Map({
        container: 'map',
        style: this.style,
        center: coords,
        zoom: this.zoom
      });
      this.watch.pipe(
        filter((p) => p.coords !== undefined) //Filter Out Errors
      ).subscribe((data) => {
        setTimeout(() => {
          const coords = [data.coords.longitude, data.coords.latitude];
          this.updateLocation(coords)
          if (this.isRecording) {
            this.updatePath(coords)
          }
        }, 0);
      });
      this.buildMap();
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  buildMap() {
    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.on('click', (event) => {
      const coordinates = [event.lngLat.lng, event.lngLat.lat];
      console.log('Click at: ', coordinates);
    });
    this.map.on('load', (event) => {
      console.log('map loaded!');
      this.loadingMap = false;
      this.addLocation();
    });

    // Unlock view when...
    this.map.on('dragstart', (event) => {
      console.log('drag');
      this.isViewLocked = false;
    });
    this.map.on('touchmove', (event) => {
      console.log('touchmove');
      this.isViewLocked = false;
    });
    this.map.on('wheel', (event) => {
      console.log('wheel');
      this.isViewLocked = false;
    });
  }

  addLocation() {
    const size = 125;

    const pulsingDot = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      map: this.map,

      onAdd() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
      },

      render() {
        const duration = 1000;
        const t = (performance.now() % duration) / duration;

        const radius = size / 2 * 0.3;
        const outerRadius = size / 2 * 0.7 * t + radius;
        const context = this.context;

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

    this.map.addSource('location', {
      type: 'geojson',
      data: new FeatureCollection([this.location])
    });

    this.map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

    this.map.addLayer({
      id: 'location',
      source: 'location',
      type: 'symbol',
      layout: {
        'icon-image': 'pulsing-dot'
      }
    });
  }

  updateLocation(coords) {
    this.location.geometry.coordinates = coords;
    this.map.getSource('location').setData(new FeatureCollection([this.location]));
    if (this.isViewLocked) {
      this.jumpTo(this.location);
    }
    console.log('Location updated:', coords);
  }

  startRecording() {
    console.log('recording started!');
    this.isRecording = true;
    this.path.geometry.coordinates.push(this.location.geometry.coordinates);

    this.map.addSource('path', {
      type: 'geojson',
      data: new FeatureCollection([this.path])
    });

    this.map.addLayer({
      "id": "path",
      "source": "path",
      "type": "line",
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": "#888",
        "line-width": 8
      }
    });
  }

  updatePath(coords) {
    this.path.geometry.coordinates.push(coords);
    this.map.getSource('path').setData(new FeatureCollection([this.path]));
    console.log('path updated!');
  }

  stopRecording() {
    console.log('recording ended!');
    this.map.removeLayer('path');
    this.map.removeSource('path');
    this.isRecording = false;
    console.log('Recorded path:', this.path);
  }

  // Button Methods

  toggleCenterMap() {
    if (!this.isViewLocked) {
      this.easeTo(this.location);
      this.map.once('moveend', (event) => {
        console.log('map locked!');
        this.isViewLocked = true
      });
    } else { 
      console.log('map unlocked!');
      this.isViewLocked = false;
    }
  }

  toggleRecord() {
    if (!this.isRecording) {
      this.startRecording();
      this.easeTo(this.location);
      this.map.once('moveend', (event) => {
        console.log('map locked!');
        this.isViewLocked = true
      });
    } else {
      this.stopRecording();
    }
  }

  // Map Methods

  easeTo(data: GeoJson) {
    this.map.easeTo({
      center: data.geometry.coordinates
    });
  }

  jumpTo(data: GeoJson) {
    this.map.jumpTo({
      center: data.geometry.coordinates
    });
  }

  flyTo(data: GeoJson) {
    this.map.flyTo({
      center: data.geometry.coordinates
    });
  }
}
