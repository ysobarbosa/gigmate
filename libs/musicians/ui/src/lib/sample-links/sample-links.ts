import { Component, computed, input } from '@angular/core';
import { samplePlatform } from '@gigmate/musicians/domain';
import { SAMPLE_PLATFORM_LABELS } from '../labels';

/**
 * Links to where someone can be heard. Re-checks every URL with the domain
 * rule before rendering: data from storage or a server is not trusted to be
 * clean, and an unknown link is simply not shown.
 */
@Component({
  selector: 'gm-sample-links',
  template: `
    @if (links().length) {
      <ul>
        @for (link of links(); track link.url) {
          <li>
            <a [href]="link.url" target="_blank" rel="noopener noreferrer">
              Ouvir no {{ link.label }}
              <span class="visually-hidden">(abre em outra aba)</span>
            </a>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './sample-links.scss',
})
export class SampleLinks {
  readonly samples = input<readonly string[]>([]);

  protected readonly links = computed(() =>
    this.samples().flatMap((url) => {
      const platform = samplePlatform(url);
      return platform ? [{ url, label: SAMPLE_PLATFORM_LABELS[platform] }] : [];
    }),
  );
}
