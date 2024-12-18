const ClientSTS = require("@aws-sdk/client-sts");
const { isAfter, subMinutes } = require("date-fns");

const client = new ClientSTS.STSClient();

function makeAttemptGetCredentials() {
	let promise = null;
	let expiry = null;

	return async function assumeAppRole() {
		if (!process.env.AWS_ROLE_ARN) {
			return;
		}

		if (shouldRefresh()) {
			await refresh();
		}

		const result = await promise;

		if (!result || !result.Credentials) {
			return;
		}

		return {
			accessKeyId: result.Credentials.AccessKeyId,
			secretAccessKey: result.Credentials.SecretAccessKey,
			sessionToken: result.Credentials.SessionToken,
		};
	};

	function shouldRefresh() {
		return !promise || !expiry || isAfter(subMinutes(new Date(), 10), expiry);
	}

	async function refresh() {
		if (!shouldRefresh()) {
			console.debug({
				state: "reuse_or_wait",
			});
			return;
		}
		console.debug({
			state: "start",
		});
		const command = new ClientSTS.AssumeRoleCommand({
			RoleArn: process.env.AWS_ROLE_ARN,
			RoleSessionName: "PortalSession",
		});
		promise = client.send(command);
		expiry = (await promise).Credentials.Expiration;
		console.debug({
			state: "end",
		});
	}
}

module.exports = {
	attemptGetCredentials: makeAttemptGetCredentials(),
};
