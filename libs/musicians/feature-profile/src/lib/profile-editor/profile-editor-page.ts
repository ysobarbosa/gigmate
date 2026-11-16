import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ViewerStore } from '@gigmate/musicians/data-access';
import {
  type ContactKind,
  MAX_SAMPLES,
  NEIGHBORHOOD_NAMES,
  PROFILE_LIMITS,
  SKILL_LEVELS,
} from '@gigmate/musicians/domain';
import {
  AvailabilityGrid,
  ChipSelect,
  CONTACT_LABELS,
  CONTACT_OPTIONS,
  GENRE_OPTIONS,
  GOAL_OPTIONS,
  INSTRUMENT_OPTIONS,
  LEVEL_LABELS,
  MusicianCard,
  SampleLinks,
} from '@gigmate/musicians/ui';
import {
  draftFromProfile,
  emptyDraft,
  type ProfileDraft,
  profileFromDraft,
} from '../profile-form/profile-draft';
import {
  PROFILE_STEPS,
  type ProfileField,
  profileSchema,
} from '../profile-form/profile-form';

/**
 * Profile wizard, for onboarding and for editing. One Signal Form holds the
 * whole draft; each step only checks its own fields before moving on.
 */
@Component({
  selector: 'gm-profile-editor-page',
  imports: [
    FormField,
    RouterLink,
    ChipSelect,
    AvailabilityGrid,
    MusicianCard,
    SampleLinks,
  ],
  templateUrl: './profile-editor-page.html',
  styleUrl: './profile-editor-page.scss',
})
export class ProfileEditorPage {
  private readonly viewerStore = inject(ViewerStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Decided once: the route guard has already loaded the viewer. */
  protected readonly editing = untracked(() => this.viewerStore.hasProfile());

  protected readonly model = signal<ProfileDraft>(
    untracked(() => {
      const viewer = this.viewerStore.viewer();
      return viewer ? draftFromProfile(viewer) : emptyDraft();
    }),
  );
  protected readonly form = form(this.model, profileSchema);

  protected readonly steps = PROFILE_STEPS;
  protected readonly step = signal(0);
  protected readonly current = computed(() => this.steps[this.step()]);
  protected readonly isLast = computed(
    () => this.step() === this.steps.length - 1,
  );
  protected readonly stepValid = computed(() =>
    this.current().fields.every((field) => this.state(field).valid()),
  );

  /** Live preview for the last step (only when the whole form is valid). */
  protected readonly preview = computed(() =>
    this.form().valid() ? profileFromDraft(this.model()) : null,
  );

  protected readonly saving = this.viewerStore.saving;
  protected readonly saveFailed = signal(false);

  protected readonly instrumentOptions = INSTRUMENT_OPTIONS;
  protected readonly genreOptions = GENRE_OPTIONS;
  protected readonly goalOptions = GOAL_OPTIONS;
  protected readonly levels = SKILL_LEVELS.map((value) => ({
    value,
    label: LEVEL_LABELS[value],
  }));
  protected readonly neighborhoods = NEIGHBORHOOD_NAMES;
  protected readonly limits = PROFILE_LIMITS;
  protected readonly maxSamples = MAX_SAMPLES;
  protected readonly contactOptions = CONTACT_OPTIONS;
  protected readonly contactLabels = CONTACT_LABELS;

  private static readonly PLACEHOLDERS: Record<ContactKind, string> = {
    whatsapp: '(11) 98765-4321',
    instagram: '@seu.perfil',
    email: 'nome@exemplo.com',
  };

  /** The value field is labelled after the chosen kind ("WhatsApp", ...). */
  protected readonly contactValueLabel = computed(() => {
    const kind = this.model().contactKind;
    return kind ? CONTACT_LABELS[kind] : 'Contato (escolha o tipo)';
  });

  protected readonly contactPlaceholder = computed(() => {
    const kind = this.model().contactKind;
    return kind ? ProfileEditorPage.PLACEHOLDERS[kind] : null;
  });

  protected state(field: ProfileField) {
    return this.form[field]();
  }

  /** Errors appear after the person touched the field or tried to move on. */
  protected errorsOf(field: ProfileField): readonly string[] {
    const state = this.state(field);
    if (!state.touched()) return [];
    return state.errors().map((error) => error.message ?? 'Campo inválido.');
  }

  /**
   * `aria-invalid` only once errors are shown, never on an untouched field.
   * `null` (not `false`) so `[attr.aria-invalid]` removes the attribute.
   */
  protected invalid(field: ProfileField): true | null {
    return this.errorsOf(field).length > 0 ? true : null;
  }

  /** Ids of the hint and visible error of a field, for `aria-describedby`. */
  protected describedBy(field: ProfileField, hasHint = false): string | null {
    const ids = [
      hasHint ? `pf-${field}-hint` : null,
      this.invalid(field) ? `pf-${field}-error` : null,
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  /** For controls bound by hand (chips, grid), which FormField cannot mark. */
  protected set<K extends ProfileField>(
    field: K,
    value: ProfileDraft[K],
  ): void {
    this.model.update((draft) => ({ ...draft, [field]: value }));
    this.state(field).markAsTouched();
  }

  protected next(): void {
    if (!this.stepValid()) {
      this.current().fields.forEach((field) =>
        this.state(field).markAsTouched(),
      );
      this.focusFirstError();
      return;
    }
    this.goTo(this.step() + 1);
  }

  protected back(): void {
    this.goTo(this.step() - 1);
  }

  protected async save(): Promise<void> {
    const draft = this.model();
    if (!this.form().valid()) {
      // Should not happen (each step was checked), but never save garbage.
      const firstBad = this.steps.findIndex((s) =>
        s.fields.some((f) => !this.state(f).valid()),
      );
      this.goTo(Math.max(firstBad, 0));
      return;
    }
    this.saveFailed.set(false);
    try {
      await this.viewerStore.save(profileFromDraft(draft));
      await this.router.navigateByUrl('/');
    } catch {
      this.saveFailed.set(true);
    }
  }

  private goTo(index: number): void {
    this.step.set(index);
    // After the new step renders, focus its title so screen readers announce it.
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('h2')?.focus(),
      { injector: this.injector },
    );
  }

  /** After the errors render, put the cursor on the first field to fix. */
  private focusFirstError(): void {
    afterNextRender(
      () => {
        const target =
          this.host.nativeElement.querySelector<HTMLElement>(
            '[aria-invalid="true"]',
          ) ??
          this.host.nativeElement.querySelector<HTMLElement>('.field-error');
        target?.focus();
        target?.scrollIntoView?.({ block: 'center' });
      },
      { injector: this.injector },
    );
  }
}
