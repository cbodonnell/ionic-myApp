import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { GeoJson, FeatureCollection } from '../models/map';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { FinishedPopoverComponent } from '../popovers/finished-popover/finished-popover.component';

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
  zoom = 14;
  loadingMap = true;

  isViewLocked = false;
  isRecording = false;

  path = new GeoJson('LineString', []);
  distance: number;
  startTime: number;
  elapsedTime: number;
  pace: number;

  constructor(private geolocation: Geolocation, private modalController: ModalController) {
    this.geolocation = geolocation;
    this.modalController = modalController;
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.watch = this.geolocation.watchPosition({
      enableHighAccuracy: true
    });
    this.initMap();
  }

  initWatch() {
    this.watch.pipe(
      filter((p) => p.coords !== undefined)
    ).subscribe((data) => {
      setTimeout(() => {
        const newCoords = [data.coords.longitude, data.coords.latitude];
        this.updateLocation(newCoords);
        if (this.isRecording) {
          this.updatePath(newCoords);
        }
      }, 0);
    });
  }

  initMap() {
    this.geolocation.getCurrentPosition({
        enableHighAccuracy: true
    }).then((resp) => {
      const startCoords = [resp.coords.longitude, resp.coords.latitude];
      this.location.geometry.coordinates = startCoords;
      this.map = new mapboxgl.Map({
        container: 'map',
        style: this.style,
        center: startCoords,
        zoom: this.zoom
      });
      this.initWatch();
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

  updateLocation(coords: number[]) {
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
    this.startTime = new Date().getTime();
    this.path.geometry.coordinates = [this.location.geometry.coordinates];
    // For testing on desktop
    // this.path.geometry.coordinates = [[-73.914, 40.699]];
    this.distance = 0.;

    this.map.addSource('path', {
      type: 'geojson',
      data: new FeatureCollection([this.path])
    });

    this.map.addLayer({
      id: 'path',
      source: 'path',
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#888',
        'line-width': 8
      }
    });
  }

  updatePath(coords: number[]) {
    this.path.geometry.coordinates.push(coords);
    this.distance += this.getDistance(
      this.path.geometry.coordinates[this.path.geometry.coordinates.length - 2],
      this.path.geometry.coordinates[this.path.geometry.coordinates.length - 1]
    );
    this.map.getSource('path').setData(new FeatureCollection([this.path]));
    console.log('path updated!');
  }

  stopRecording() {
    this.map.removeLayer('path');
    this.map.removeSource('path');
    this.elapsedTime = (new Date().getTime() - this.startTime) / 1000; // in seconds
    console.log('recording ended!');
    this.isRecording = false;
    this.pace = (this.elapsedTime / 60) / this.distance;
    this.showFinishedModal();
  }

  // Button Methods

  toggleCenterMap() {
    if (!this.isViewLocked) {
      this.easeTo(this.location);
      this.map.once('moveend', (event) => {
        console.log('map locked!');
        this.isViewLocked = true;
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
        this.isViewLocked = true;
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

  // Math Methods

  getDistance(startCoords: number[], endCoords: number[]) {
    const p = 0.017453292519943295;    // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((endCoords[1] - startCoords[1]) * p) / 2 +
            c(startCoords[1] * p) * c(endCoords[1] * p) *
            (1 - c((endCoords[0] - startCoords[0]) * p)) / 2;

    const distance = 12742 * Math.asin(Math.sqrt(a));
    return distance * 0.621371; // convert to miles
  }

  // UI Methods

  async showFinishedModal() {
    const modal = await this.modalController.create({
      component: FinishedPopoverComponent,
      componentProps: {
        time: this.elapsedTime,
        distance: this.distance,
        pace: this.pace
      }
    });
    return await modal.present();
  }
}

