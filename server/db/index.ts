import { PostgresStore } from 'bgio-postgres';
import { DataTypes, Sequelize } from 'sequelize';

export const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
});
export const db = new PostgresStore(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
});

export const Match = db.sequelize.model('Match');

export const TempUser = sequelize.define('TempUser', {
  name: { type: DataTypes.TEXT, allowNull: false },
  credentials: { type: DataTypes.UUID, allowNull: false },
});
export const User = sequelize.define('User', {
  name: { type: DataTypes.TEXT, allowNull: false, unique: true },
  credentials: { type: DataTypes.UUID, allowNull: false },
  discordUser: DataTypes.JSON,
  discordOauth: DataTypes.JSON,
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
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  lastPoke: { type: DataTypes.DATE, allowNull: true },
});
Match.belongsToMany(User, { through: UserMatch });
User.belongsToMany(Match, { through: UserMatch });
sequelize
  .sync()
  .then(() => console.log('All models synced!'))
  .catch(console.error);
