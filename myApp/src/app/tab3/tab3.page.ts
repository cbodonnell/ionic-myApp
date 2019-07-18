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
  location: GeoJson = new GeoJson([0, 0]);

  constructor(private geolocation: Geolocation) {
    this.geolocation = geolocation;
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.initMap();
  }

  initMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const coords = [resp.coords.longitude, resp.coords.latitude];
      this.location.geometry.coordinates = coords;
      this.map = new mapboxgl.Map({
        container: 'map',
        style: this.style,
        center: coords,
        zoom: this.zoom
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
      const coordinates = [event.lngLat.lng, event.lngLat.lat];
      console.log('Click at: ', coordinates);
    });
    this.map.on('load', (event) => {
      console.log('map loaded!');
      this.addLocation();
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

  updateLocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const coords = [resp.coords.longitude, resp.coords.latitude];
      this.location.geometry.coordinates = coords;
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  centerMap(location: GeoJson) {
    this.easeTo(location);
  }

  // Helpers

  easeTo(data: GeoJson) {
    this.map.easeTo({
      center: data.geometry.coordinates
    });
  }

  flyTo(data: GeoJson) {
    this.map.flyTo({
      center: data.geometry.coordinates
    });
  }
}

