import { NextFunction, Request, Response } from 'express';
import { auth } from '../firebase';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente' });
  }

  const token = header.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('Falha ao verificar token:', err);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}


// card_id=UleiL12ktpOgn73BjcGt