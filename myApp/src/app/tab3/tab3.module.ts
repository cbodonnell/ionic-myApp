import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { FinishedPopoverComponent } from '../popovers/finished-popover/finished-popover.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: Tab3Page }]),
  ],
  entryComponents: [FinishedPopoverComponent],
  declarations: [Tab3Page, FinishedPopoverComponent]
})
export class Tab3PageModule {}
