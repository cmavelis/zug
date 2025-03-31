import { PostgresStore } from 'bgio-postgres';
import { DataTypes, Sequelize } from 'sequelize';

export const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  logging: false,
});
export const db = new PostgresStore(process.env.DATABASE_URL as string, {
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
  name: { type: DataTypes.TEXT, allowNull: false, unique: true },
  clerkId: { type: DataTypes.UUID, allowNull: false, unique: true },
  isGuest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
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
