import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ViewerStore } from '@gigmate/musicians/data-access';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'gm-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = 'Gigmate';
  protected readonly viewer = inject(ViewerStore);
}
