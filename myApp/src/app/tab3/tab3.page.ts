import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';
import { Geolocation } from '@ionic-native/geolocation/ngx';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['./tab3.page.scss']
})
export class Tab3Page implements OnInit {

  map: mapboxgl.Map;
  style = 'mapbox://styles/mapbox/streets-v11';
  zoom = 9;

  constructor(private geolocation: Geolocation) {
    this.geolocation = geolocation;
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.initMap();
  }

  centerMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const coords = [resp.coords.longitude, resp.coords.latitude];
      this.map.setCenter(coords);
     }).catch((error) => {
      console.log('Error getting location', error);
     });
  }

  initMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const coords = [resp.coords.longitude, resp.coords.latitude];
      this.map = new mapboxgl.Map({
        container: 'map', // container id
        style: this.style, // stylesheet location
        center: coords, // starting position [lng, lat]
        zoom: this.zoom // starting zoom
      });
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }
}
