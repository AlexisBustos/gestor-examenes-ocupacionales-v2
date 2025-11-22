import app from './app';
import { envs } from './config/envs';

async function main() {
    try {
        app.listen(envs.PORT, () => {
            console.log(`
      ################################################
      🛡️  Server listening on port: ${envs.PORT} 🛡️
      ################################################
      `);
        });
    } catch (error) {
        console.error(error);
    }
}

main();
