declare module "detect-node" {
	const detectnode: boolean;
	export = detectnode;
}

declare module "form-data" {
	const FormData: string;
	export default FormData as any;
}

declare module "tough-cookie" {
	export class CookieJar {}
}
