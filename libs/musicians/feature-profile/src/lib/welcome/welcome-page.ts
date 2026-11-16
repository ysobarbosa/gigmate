import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DEMO_VIEWER, ViewerStore } from '@gigmate/musicians/data-access';

/** First visit: create a profile, or look around as the demo musician. */
@Component({
  selector: 'gm-welcome-page',
  imports: [RouterLink],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
})
export class WelcomePage {
  private readonly viewerStore = inject(ViewerStore);
  private readonly router = inject(Router);

  protected readonly saving = this.viewerStore.saving;
  protected readonly failed = signal(false);

  protected async exploreAsDemo(): Promise<void> {
    this.failed.set(false);
    try {
      await this.viewerStore.save(DEMO_VIEWER);
      await this.router.navigateByUrl('/');
    } catch {
      this.failed.set(true);
    }
  }
}
