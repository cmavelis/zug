import { PostgresStore } from 'bgio-postgres';
import { DataTypes, Sequelize } from 'sequelize';

const DATABASE_URL: string =
  process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL;

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});
export const db = new PostgresStore(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

export const Match = db.sequelize.model('Match');

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  clerkId: { type: DataTypes.STRING, allowNull: false, unique: true },
  isGuest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

export const UserMatch = sequelize.define('UserMatch', {
  MatchId: {
    type: DataTypes.INTEGER,
    references: {
      model: Match,
      key: 'id',
    },
  },
  UserId: {
    type: DataTypes.UUIDV4,
    references: {
      model: User,
      key: 'id',
    },
  },
  lastPoke: { type: DataTypes.DATE, allowNull: true },
});
Match.belongsToMany(User, { through: UserMatch });
User.belongsToMany(Match, { through: UserMatch });
export const dbInitialized = sequelize
  .sync()
  .then(() => {
    console.log('All models synced!');
    return true;
  })
  .catch((e) => {
    console.error(e);
    return false;
  });
