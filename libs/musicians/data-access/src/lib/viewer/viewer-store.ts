import { computed, inject, Service, signal } from '@angular/core';
import type { MusicianProfile } from '@gigmate/musicians/domain';
import { firstValueFrom, type Observable, of, tap } from 'rxjs';
import { DeckStore } from '../deck/deck-store';
import { ProfilesRepository } from '../ports';

interface ViewerState {
  readonly viewer: MusicianProfile | null;
  /** Whether we already asked the repository (null viewer is a valid answer). */
  readonly loaded: boolean;
  readonly saving: boolean;
  readonly error: unknown;
}

/** The signed-in musician's own profile: who they are and what they look for. */
@Service()
export class ViewerStore {
  private readonly profiles = inject(ProfilesRepository);
  private readonly deck = inject(DeckStore);

  private readonly state = signal<ViewerState>({
    viewer: null,
    loaded: false,
    saving: false,
    error: null,
  });

  readonly viewer = computed(() => this.state().viewer);
  readonly hasProfile = computed(() => this.state().viewer !== null);
  readonly saving = computed(() => this.state().saving);
  readonly error = computed(() => this.state().error);

  /**
   * For route guards: asks the repository once, then answers from memory.
   * Returns an Observable because guards accept one directly.
   */
  ensureLoaded(): Observable<MusicianProfile | null> {
    const { loaded, viewer } = this.state();
    if (loaded) return of(viewer);
    return this.profiles
      .getViewer()
      .pipe(
        tap((loadedViewer) =>
          this.patch({ viewer: loadedViewer, loaded: true }),
        ),
      );
  }

  /**
   * Saves and resolves when done, so the caller can navigate afterwards.
   * Rejects (and keeps `error`) when saving fails; the form stays as it was.
   */
  async save(profile: MusicianProfile): Promise<void> {
    this.patch({ saving: true, error: null });
    try {
      await firstValueFrom(this.profiles.saveViewer(profile));
      this.patch({ viewer: profile, loaded: true });
      this.deck.replaceViewer(profile);
    } catch (error) {
      this.patch({ error });
      throw error;
    } finally {
      this.patch({ saving: false });
    }
  }

  private patch(partial: Partial<ViewerState>): void {
    this.state.update((s) => ({ ...s, ...partial }));
  }
}
