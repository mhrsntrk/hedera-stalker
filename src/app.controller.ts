import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  dashboard(@Res() res: Response) {
    const htmlPath = join(__dirname, '..', 'public', 'index.html');
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf8');
      res.send(html);
    } else {
      res.status(404).send('Dashboard not found');
    }
  }
}

