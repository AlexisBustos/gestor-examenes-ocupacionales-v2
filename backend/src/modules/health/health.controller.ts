import { Request, Response } from 'express';

export class HealthController {
    static getHealth(req: Request, res: Response) {
        res.json({
            status: 'ok',
            service: 'Antigravity API',
            timestamp: new Date().toISOString(),
        });
    }
}
