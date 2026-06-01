import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function stripIpv6Brackets(hostname: string): string {
	return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function ipv4ToNumber(address: string): number | null {
	const parts = address.split(".");
	if (parts.length !== 4) return null;
	let value = 0;
	for (const part of parts) {
		if (!/^\d+$/.test(part)) return null;
		const octet = Number(part);
		if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
		value = (value << 8) + octet;
	}
	return value >>> 0;
}

function isIpv4InCidr(address: string, base: string, prefix: number): boolean {
	const addressNumber = ipv4ToNumber(address);
	const baseNumber = ipv4ToNumber(base);
	if (addressNumber === null || baseNumber === null) return false;
	const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
	return (addressNumber & mask) === (baseNumber & mask);
}

function expandIpv6(address: string): number[] | null {
	const zoneIndex = address.indexOf("%");
	const cleanAddress = (zoneIndex >= 0 ? address.slice(0, zoneIndex) : address).toLowerCase();
	const ipv4Match = cleanAddress.match(/(.+:)(\d+\.\d+\.\d+\.\d+)$/);
	let normalized = cleanAddress;
	let ipv4Groups: number[] = [];
	if (ipv4Match) {
		const ipv4 = ipv4ToNumber(ipv4Match[2]);
		if (ipv4 === null) return null;
		ipv4Groups = [(ipv4 >>> 16) & 0xffff, ipv4 & 0xffff];
		normalized = `${ipv4Match[1]}ipv4`;
	}

	const halves = normalized.split("::");
	if (halves.length > 2) return null;
	const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
	const right = halves[1] ? halves[1].split(":").filter(Boolean) : [];
	const parseGroup = (group: string): number | null => {
		if (group === "ipv4") return -1;
		if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
		return Number.parseInt(group, 16);
	};

	const parsedLeft = left.map(parseGroup);
	const parsedRight = right.map(parseGroup);
	if (parsedLeft.includes(null) || parsedRight.includes(null)) return null;
	const explicit = [...(parsedLeft as number[]), ...(parsedRight as number[])];
	const ipv4PlaceholderIndex = explicit.indexOf(-1);
	if (ipv4PlaceholderIndex >= 0) {
		explicit.splice(ipv4PlaceholderIndex, 1, ...ipv4Groups);
	}
	const missing = 8 - explicit.length;
	if (halves.length === 1 && missing !== 0) return null;
	if (halves.length === 2 && missing < 0) return null;
	return [...(parsedLeft as number[]), ...Array(Math.max(0, missing)).fill(0), ...(parsedRight as number[])]
		.flatMap((group) => (group === -1 ? ipv4Groups : [group]));
}

function ipv6StartsWith(address: string, prefixGroups: number[], prefixBits: number): boolean {
	const groups = expandIpv6(address);
	if (!groups || groups.length !== 8) return false;
	let remaining = prefixBits;
	for (let index = 0; index < 8 && remaining > 0; index++) {
		const bits = Math.min(16, remaining);
		const mask = (0xffff << (16 - bits)) & 0xffff;
		if ((groups[index] & mask) !== ((prefixGroups[index] ?? 0) & mask)) return false;
		remaining -= bits;
	}
	return true;
}

export function isBlockedIpAddress(address: string): boolean {
	const normalized = stripIpv6Brackets(address).toLowerCase();
	const family = isIP(normalized);
	if (family === 4) {
		const blockedIpv4Ranges = [
			["0.0.0.0", 8],
			["10.0.0.0", 8],
			["100.64.0.0", 10],
			["127.0.0.0", 8],
			["169.254.0.0", 16],
			["172.16.0.0", 12],
			["192.0.0.0", 24],
			["192.0.2.0", 24],
			["192.168.0.0", 16],
			["198.18.0.0", 15],
			["198.51.100.0", 24],
			["203.0.113.0", 24],
			["224.0.0.0", 4],
			["240.0.0.0", 4],
		] satisfies Array<[string, number]>;
		return blockedIpv4Ranges.some(([base, prefix]) => isIpv4InCidr(normalized, base, prefix));
	}
	if (family === 6) {
		if (normalized === "::" || normalized === "::1") return true;
		const blockedIpv6Ranges = [
			[expandIpv6("::ffff:0:0")!, 96],
			[expandIpv6("64:ff9b::")!, 96],
			[expandIpv6("100::")!, 64],
			[expandIpv6("2001::")!, 32],
			[expandIpv6("2001:db8::")!, 32],
			[expandIpv6("fc00::")!, 7],
			[expandIpv6("fe80::")!, 10],
			[expandIpv6("ff00::")!, 8],
		] satisfies Array<[number[], number]>;
		return blockedIpv6Ranges.some(([prefixGroups, prefix]) =>
			ipv6StartsWith(normalized, prefixGroups, prefix),
		);
	}
	return true;
}

export function parsePublicHttpUrl(value: string): URL {
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error("Invalid endpoint URL");
	}
	if (parsed.username || parsed.password) {
		throw new Error("Endpoint URL must not contain credentials");
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error("Endpoint URL must use http or https protocol");
	}
	const hostname = stripIpv6Brackets(parsed.hostname.toLowerCase());
	if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
		throw new Error("Endpoint URL points to a blocked address");
	}
	if (isIP(hostname) && isBlockedIpAddress(hostname)) {
		throw new Error("Endpoint URL points to a blocked address");
	}
	return parsed;
}

export function isSyntacticallyPublicHttpUrl(value: string): boolean {
	try {
		parsePublicHttpUrl(value);
		return true;
	} catch {
		return false;
	}
}

export async function assertPublicHttpUrl(value: string): Promise<URL> {
	const parsed = parsePublicHttpUrl(value);
	const hostname = stripIpv6Brackets(parsed.hostname.toLowerCase());
	if (!isIP(hostname)) {
		let addresses: Array<{ address: string }>;
		try {
			addresses = await lookup(hostname, { all: true, verbatim: true });
		} catch {
			throw new Error("Endpoint URL hostname could not be resolved");
		}
		if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIpAddress(address))) {
			throw new Error("Endpoint URL points to a blocked address");
		}
	}
	return parsed;
}
