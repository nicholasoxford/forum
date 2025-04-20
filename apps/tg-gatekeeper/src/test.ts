// Function to set up a Telegram webhook
async function setTelegramWebhook(botToken: string, webhookUrl: string, secretToken: string) {
	const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			url: webhookUrl,
			secret_token: secretToken, // optional but recommended
		}),
	});

	const data = await response.json();
	console.log('Webhook setup response:', data);
	return data;
}

// Example usage:
// Replace with your actual bot token and webhook URL
// setTelegramWebhook(
//   'YOUR_BOT_TOKEN',
//   'https://tg-gatekeeper.noxford1.workers.dev/tg/super-random-123',
//   'super-random-123'
// );

setTelegramWebhook(
	'8095190674:AAFsYegeAhzDl7vkEUgIgCEKFj0puLMK_WU',
	'https://tg-gatekeeper.noxford1.workers.dev/tg/super-random-123',
	'super-random-123',
);
