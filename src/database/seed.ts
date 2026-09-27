/**
 * Script de seed pour peupler la base en développement.
 * Usage : npm run seed
 *
 * Solution définitive pour l'erreur SASL "password must be a string" sur Windows :
 * - Chargement du .env avec le chemin absolu via path.resolve()
 * - Cast explicite String() sur le password APRÈS chargement dotenv
 * - Fallback 'postgres' si la variable est toujours undefined
 */
import * as path from 'path';
import * as dotenv from 'dotenv';

// Charger le .env depuis la racine du projet (deux niveaux au-dessus de src/database/)
const envPath = path.resolve(__dirname, '..', '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️  Impossible de charger ${envPath} — utilisation des valeurs par défaut`);
}

// Import APRÈS dotenv.config() pour que process.env soit disponible
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Récupération sécurisée des variables — String() garantit que pg reçoit une string
const DB_HOST     = String(process.env.DB_HOST     ?? 'localhost');
const DB_PORT     = parseInt(process.env.DB_PORT    ?? '5432', 10);
const DB_USERNAME = String(process.env.DB_USERNAME  ?? 'postgres');
const DB_PASSWORD = String(process.env.DB_PASSWORD  ?? '');
const DB_NAME     = String(process.env.DB_NAME      ?? 'zonalert_db');

console.log(`📦 Connexion à PostgreSQL : ${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
console.log(`🔑 Password défini : ${DB_PASSWORD.length > 0 ? 'OUI (' + DB_PASSWORD.length + ' caractères)' : '❌ NON — vérifiez votre .env'}`);

const dataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  entities: [path.resolve(__dirname, '..', '**', '*.entity{.ts,.js}')],
  synchronize: true,
  logging: false,
});

async function seed(): Promise<void> {
  await dataSource.initialize();
  console.log('✅ Connexion BDD établie\n');

  const hash = await bcrypt.hash('password123', 10);

  // ── Users ──────────────────────────────────────────────────────────────────
  await dataSource.query(`
    INSERT INTO users ("firstName","lastName",email,phone,city,role,password,"isActive","refreshToken","updatedAt")
    VALUES
      ('Admin',    'ZonAlert',  'admin@zonalert.bj',     '+22997000001','Cotonou','admin',        '${hash}',true,NULL,NOW()),
      ('Koffi',    'Akplogan',  'koffi@example.com',     '+22997000002','Cotonou','citizen',      '${hash}',true,NULL,NOW()),
      ('Adjoa',    'Mensah',    'adjoa@example.com',     '+22997000003','Parakou','citizen',      '${hash}',true,NULL,NOW()),
      ('Séraphin', 'Dossou',    'seraphin@example.com',  '+22997000004','Cotonou','professional', '${hash}',true,NULL,NOW())
    ON CONFLICT (email) DO NOTHING;
  `);
  console.log('✅ Users seedés');

  // ── Professional ───────────────────────────────────────────────────────────
  const proUser = await dataSource.query(
    `SELECT id FROM users WHERE email = 'seraphin@example.com' LIMIT 1`,
  );
  if (proUser.length > 0) {
    const userId = proUser[0].id;
    await dataSource.query(`
      INSERT INTO professionals
        ("userId","firstName","lastName",phone,specialty,bio,city,zone,latitude,longitude,"isAvailable",rating,"reviewCount","updatedAt")
      VALUES (
        '${userId}','Séraphin','Dossou','+22997000004','electrician',
        'Électricien certifié avec 10 ans d''expérience dans la région de Cotonou.',
        'Cotonou','Cadjehoun',6.3584,2.3896,true,4.5,12,NOW()
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Professional seedé');
  }

  // ── Incidents ──────────────────────────────────────────────────────────────
  const citizen = await dataSource.query(
    `SELECT id FROM users WHERE email = 'koffi@example.com' LIMIT 1`,
  );
  if (citizen.length > 0) {
    const userId = citizen[0].id;
    await dataSource.query(`
      INSERT INTO incidents
        (type,status,description,address,latitude,longitude,"priorityScore","reportCount","confirmationCount","userId","updatedAt")
      VALUES
        ('electricity','confirmed',
         'Panne totale de courant depuis 3h du matin. Tout le quartier affecté.',
         'Quartier Cadjehoun, Cotonou',6.3584,2.3896,30,0,3,'${userId}',NOW()),
        ('water','new',
         'Coupure d''eau sans préavis depuis hier soir.',
         'Avenue Steinmetz, Cotonou',6.3641,2.4198,10,0,1,'${userId}',NOW()),
        ('electricity','in_progress',
         'Poteau électrique tombé sur la chaussée, danger pour les riverains.',
         'Carrefour Godomey, Abomey-Calavi',6.4173,2.3267,80,2,7,'${userId}',NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Incidents seedés');
  }

  await dataSource.destroy();
  console.log('\n🎉 Seed terminé avec succès !');
  console.log('\nComptes de test :');
  console.log('  Admin         → admin@zonalert.bj      / password123');
  console.log('  Citoyen       → koffi@example.com      / password123');
  console.log('  Professionnel → seraphin@example.com   / password123');
}

seed().catch((err) => {
  console.error('\n❌ Erreur seed :', err.message ?? err);
  console.error('\n💡 Vérifiez que :');
  console.error('   1. Le fichier .env existe à la racine du projet');
  console.error('   2. DB_PASSWORD est défini (même vide : DB_PASSWORD=)');
  console.error('   3. La base de données zonalert_db existe dans PostgreSQL');
  process.exit(1);
});
