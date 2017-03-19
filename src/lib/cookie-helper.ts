"use strict";

export default class CookieHelper {
	public static hasItem(key: string): boolean {
		return !!this.getItem(key);
	}

	public static getItem(key: string): string {
		let result = document.cookie.replace(new RegExp("(?:(?:^|.*;\\\s*)"
			+ encodeURIComponent(key) + "\\\s*\\\=\\\s*([^;]*).*$)|^.*$"), "$1");
		return result ? result[1] : null;
	}

	public static setItem(key: string, value: string, expires: Date, path?: string, domain?: string, secure?: boolean) {
		document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value)
			+ "; expires=" + expires.toUTCString()
			+ (domain ? "; domain=" + domain : "")
			+ (path ? "; path=" + path : "")
			+ (secure ? "; secure" : "");
	}

	public static removeItem(key: string, path?: string, domain?: string) {
		if (CookieHelper.hasItem(key)) {
			this.setItem(key, "", new Date(0), path, domain);
		}
	}
}
