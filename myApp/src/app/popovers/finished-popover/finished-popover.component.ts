import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-finished-popover',
  templateUrl: './finished-popover.component.html',
  styleUrls: ['./finished-popover.component.scss'],
})
export class FinishedPopoverComponent {

  @Input() distance: number;
  @Input() time: number;
  @Input() pace: number;

  constructor(private modalController: ModalController) {
    this.modalController = modalController;
  }

  dismiss() {
    this.modalController.dismiss({
      dismissed: true
    });
  }

}
