import { Component, computed, inject, input, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchesStore } from '@gigmate/musicians/data-access';
import { contactHref, isFakeMusician } from '@gigmate/musicians/domain';
import {
  CONTACT_LABELS,
  MusicianCard,
  SampleLinks,
} from '@gigmate/musicians/ui';
import { formatMatchDate } from '../format';

/**
 * One match: the full card, the contact the match unlocked and the samples.
 * `id` comes from the route (`/matches/:id`) through component input binding.
 */
@Component({
  selector: 'gm-match-detail-page',
  imports: [RouterLink, MusicianCard, SampleLinks],
  templateUrl: './match-detail-page.html',
  styleUrl: './match-detail-page.scss',
})
export class MatchDetailPage implements OnInit {
  readonly id = input.required<string>();

  protected readonly store = inject(MatchesStore);
  protected readonly entry = computed(
    () => this.store.entries().find((e) => e.profile.id === this.id()) ?? null,
  );
  protected readonly isFake = computed(() => {
    const entry = this.entry();
    return entry ? isFakeMusician(entry.profile) : false;
  });
  protected readonly contactLink = computed(() => {
    const contact = this.entry()?.contact;
    if (!contact) return null;
    return {
      href: contactHref(contact),
      label: `Chamar no ${CONTACT_LABELS[contact.kind]}`,
      // mailto: opens the mail app; web links open in a new tab.
      external: contact.kind !== 'email',
    };
  });
  protected readonly date = formatMatchDate;

  ngOnInit(): void {
    // Opening the link directly (or after a reload) must work too.
    this.store.load();
  }
}
