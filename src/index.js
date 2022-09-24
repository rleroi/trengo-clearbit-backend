async function getClearbitDataFromTicketId(ticketId, env) {
	// First we need to get the ticket from Trengo
	const ticket = await trengoRequest(`/tickets/${ticketId}`, env);

	// Get the contact's email address from the ticket
	const email = ticket.contact.email;

	// Get the Clearbit data using the email address
	const data = await clearbitRequest(`https://person.clearbit.com/v2/combined/find?email=${email}`, env);

	return {
		fullName: data.person?.name?.fullName,
		companyName: data.company?.name,
		location: data.person?.location,
		role: data.person?.employment?.role,
		linkedin: data.person?.linkedin?.handle ? `https://linkedin.com/in/${data.person.linkedin.handle}` : null,
		companyLogo: data.company?.logo,
	}
}

async function trengoRequest(path, env, options = {}) {
	options = {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${env.TRENGO_API_TOKEN}`,
			'Content-Type': 'application/json',
		},
		...options,
	};
	const res = await fetch(`https://app.trengo.com/api/v2${path}`, options);

	return await res.json();
}

async function clearbitRequest(url, env, options = {}) {
	options = {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${env.CLEARBIT_API_TOKEN}`,
			'Content-Type': 'application/json',
		},
		...options,
	};
	const res = await fetch(url, options);

	return await res.json();
}

export default {
	// This is where every request to our CF Worker comes in
	async fetch(request, env) {
		// Get the URL params
		const params = new URLSearchParams(request.url.split('?')?.[1] || '');

		// Make sure the app token is valid
		if (params.get('token') !== env.TRENGO_APP_TOKEN) {
			return new Response('Unauthorized', {status: 401});
		}

		const data = await getClearbitDataFromTicketId(params.get('ticket_id'), env)
		return new Response(
			JSON.stringify(data),
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			}
		);
	},
};
