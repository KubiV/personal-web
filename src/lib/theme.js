import { writable } from 'svelte/store';

/**
 * NOAA Solar Calculation algorithm.
 * Přesný astronomický výpočet východu a západu slunce pro dané souřadnice a datum.
 *
 * @param {number} lat - Zeměpisná šířka ve stupních (-90 až 90)
 * @param {number} lng - Zeměpisná délka ve stupních (-180 až 180)
 * @param {Date} date - Datum pro výpočet
 * @returns {{ sunrise: Date|null, sunset: Date|null, isDark: boolean }}
 */
export function calculateSunTimes(lat, lng, date = new Date()) {
	const startOfYearUtc = Date.UTC(date.getUTCFullYear(), 0, 1);
	const dayOfYear = Math.floor((date.getTime() - startOfYearUtc) / 86400000) + 1;

	const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);

	const eqtime =
		229.18 *
		(0.000075 +
			0.001868 * Math.cos(gamma) -
			0.032077 * Math.sin(gamma) -
			0.014615 * Math.cos(2 * gamma) -
			0.040849 * Math.sin(2 * gamma));

	const decl =
		0.006918 -
		0.399912 * Math.cos(gamma) +
		0.070257 * Math.sin(gamma) -
		0.006758 * Math.cos(2 * gamma) +
		0.000907 * Math.sin(2 * gamma) -
		0.002697 * Math.cos(3 * gamma) +
		0.00148 * Math.sin(3 * gamma);

	const latRad = (lat * Math.PI) / 180;
	const cosZenith = Math.cos((90.833 * Math.PI) / 180);

	const cosOmega =
		(cosZenith - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));

	if (cosOmega > 1) {
		return { sunrise: null, sunset: null, isDark: true };
	}
	if (cosOmega < -1) {
		return { sunrise: null, sunset: null, isDark: false };
	}

	const omega = Math.acos(cosOmega) * (180 / Math.PI);
	const solarNoonUtc = 720 - 4 * lng - eqtime;
	const sunriseUtc = solarNoonUtc - 4 * omega;
	const sunsetUtc = solarNoonUtc + 4 * omega;

	const startOfDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	const sunrise = new Date(startOfDay + sunriseUtc * 60000);
	const sunset = new Date(startOfDay + sunsetUtc * 60000);

	const nowMs = date.getTime();
	const isDark = nowMs < sunrise.getTime() || nowMs >= sunset.getTime();

	return { sunrise, sunset, isDark };
}

/**
 * Odhad souřadnic z časového posunu a pásma uživatele
 */
export function estimateCoordinatesFromTimezone(date = new Date()) {
	const offsetHours = -date.getTimezoneOffset() / 60;
	const estimatedLng = Math.max(-180, Math.min(180, offsetHours * 15));
	let estimatedLat = 50.0;

	try {
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
		if (
			tz.startsWith('Australia/') ||
			tz.startsWith('Pacific/Auckland') ||
			tz.startsWith('America/Argentina') ||
			tz.startsWith('America/Santiago') ||
			tz.startsWith('America/Sao_Paulo') ||
			tz.startsWith('Africa/Johannesburg')
		) {
			estimatedLat = -34.0;
		} else if (tz.startsWith('America/')) {
			estimatedLat = 40.0;
		} else if (tz.startsWith('Asia/Tokyo') || tz.startsWith('Asia/Seoul')) {
			estimatedLat = 36.0;
		}
	} catch (_) {}

	return { lat: estimatedLat, lng: estimatedLng };
}

const STORAGE_OVERRIDE_KEY = 'theme-override';
const STORAGE_LOC_KEY = 'user_location';

function getStoredLocation() {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(STORAGE_LOC_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
			return parsed;
		}
	} catch (_) {}
	return null;
}

/**
 * Zjistí automatické téma podle systémového nastavení a denní doby (západ/východ slunce)
 */
function determineAutoTheme() {
	if (typeof window === 'undefined') return 'light';

	// 1. Zkontrolujeme systémové nastavení zařízení (pokud je dostupné a aktivní)
	if (window.matchMedia) {
		const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		if (systemDark) {
			return 'dark';
		}
	}

	// 2. Pokud systém nehlásí dark, vyhodnotíme podle denní doby a západu/východu slunce
	const now = new Date();
	const coords = getStoredLocation() || estimateCoordinatesFromTimezone(now);
	const sun = calculateSunTimes(coords.lat, coords.lng, now);

	return sun.isDark ? 'dark' : 'light';
}

function createThemeStore() {
	const { subscribe, set, update } = writable({
		currentTheme: 'light',
		isOverridden: false
	});

	let initialized = false;
	let intervalId = null;

	function applyToDOM(theme) {
		if (typeof document === 'undefined') return;
		const root = document.documentElement;
		root.setAttribute('data-theme', theme);
		root.classList.toggle('dark', theme === 'dark');
	}

	function evaluateTheme() {
		if (typeof window === 'undefined') return;

		let override = null;
		try {
			override = localStorage.getItem(STORAGE_OVERRIDE_KEY);
		} catch (_) {}

		let theme = 'light';
		let isOverridden = false;

		if (override === 'dark' || override === 'light') {
			theme = override;
			isOverridden = true;
		} else {
			theme = determineAutoTheme();
			isOverridden = false;
		}

		applyToDOM(theme);

		set({
			currentTheme: theme,
			isOverridden
		});
	}

	return {
		subscribe,

		init() {
			if (typeof window === 'undefined' || initialized) return;
			initialized = true;

			evaluateTheme();

			// Kontrola každých 60 sekund (pro automatické přepnutí den/noc při západu/východu slunce)
			intervalId = setInterval(evaluateTheme, 60000);

			// Naslouchání na systémovou změnu motivu (prefers-color-scheme)
			if (window.matchMedia) {
				const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
				const listener = () => evaluateTheme();
				if (mediaQuery.addEventListener) {
					mediaQuery.addEventListener('change', listener);
				} else if (mediaQuery.addListener) {
					mediaQuery.addListener(listener);
				}
			}

			// Zjištění polohy na pozadí, pokud již byla v prohlížeči dříve povolena
			if (navigator.permissions && navigator.permissions.query) {
				navigator.permissions
					.query({ name: 'geolocation' })
					.then((status) => {
						if (status.state === 'granted') {
							navigator.geolocation.getCurrentPosition((pos) => {
								try {
									localStorage.setItem(
										STORAGE_LOC_KEY,
										JSON.stringify({
											lat: pos.coords.latitude,
											lng: pos.coords.longitude
										})
									);
								} catch (_) {}
								evaluateTheme();
							});
						}
					})
					.catch(() => {});
			}
		},

		/**
		 * Manuální přepnutí na opačný režim (přepisuje automatiku)
		 */
		toggle() {
			if (typeof window === 'undefined') return;

			let current = 'light';
			const unsubscribe = subscribe((state) => (current = state.currentTheme));
			unsubscribe();

			const next = current === 'dark' ? 'light' : 'dark';

			try {
				localStorage.setItem(STORAGE_OVERRIDE_KEY, next);
			} catch (_) {}

			applyToDOM(next);

			set({
				currentTheme: next,
				isOverridden: true
			});
		},

		destroy() {
			if (intervalId) clearInterval(intervalId);
		}
	};
}

export const themeStore = createThemeStore();
