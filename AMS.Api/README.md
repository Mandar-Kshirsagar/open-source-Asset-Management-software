## OpenAI API Key Setup

- For local development, copy `AMS.Api/appsettings.Development.json` and set your OpenAI API key in the `OpenAI.ApiKey` field.
- **Never commit real API keys to version control.**
- For production, set the environment variable `OpenAI__ApiKey` on your server. ASP.NET Core will use this value instead of the config file.
- If you accidentally commit a real key, revoke it immediately in your OpenAI dashboard and generate a new one.

Contact: mandarkshirsagar1@outlook.com