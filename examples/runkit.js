const cocoonSDK = require("cocoon-cloud-sdk");

const CLIENT_ID = "";
const CLIENT_SECRET = "";
const USERNAME = "";
const PASSWORD = "";

const oAuth = new cocoonSDK.OAuth("password", CLIENT_ID, CLIENT_SECRET);

oAuth.tokenExchangePassword(USERNAME, PASSWORD)
.then((response) => {
	cocoonSDK.CocoonAPI.setupAPIAccess(response.access_token, response.refresh_token, response.expires_in);
	return undefined;
})
.then(cocoonSDK.UserAPI.get)
.then((me) => {
	console.log(me);
	return undefined;
})
.catch(console.error);
