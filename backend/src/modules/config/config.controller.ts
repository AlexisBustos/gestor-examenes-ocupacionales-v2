import { Request, Response } from 'express';
import { importRulesDb, getRulesDb, createRuleDb, deleteRuleDb } from './config.service';

export const importRules = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Falta archivo' });
        const result = await importRulesDb(req.file.buffer);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: 'Error importando reglas', details: e.message }); }
};

export const getRules = async (req: Request, res: Response) => {
    try { res.json(await getRulesDb()); } catch (e) { res.status(500).json({ error: 'Error obteniendo reglas' }); }
};

export const createRule = async (req: Request, res: Response) => {
    try {
        // Esperamos riskAgentName, specificDetail y batteryId
        const { riskAgentName, specificDetail, batteryId } = req.body;

        if (!riskAgentName || !batteryId) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (Agente o Batería)' });
        }

        const rule = await createRuleDb({ riskAgentName, specificDetail, batteryId });
        res.json(rule);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error creando regla' });
    }
};

export const deleteRule = async (req: Request, res: Response) => {
    try { await deleteRuleDb(req.params.id); res.json({ message: 'Eliminada' }); } catch (e) { res.status(500).json({ error: 'Error borrar' }); }
};