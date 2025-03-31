const { User } = require("../db/models");

const getUser = async (req, res) => {
  try {
    const auth0_id = req.auth.payload.sub;

    const user = await User.findOne({ where: { auth0_id } });
    if (!user) {
      return res.status(404).json({ error: "User not found in DB" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const syncUser = async (req, res) => {
  const auth0_id = req.auth.payload.sub;
  const { name, email } = req.body;

  try {
    const [user, created] = await User.findOrCreate({
      where: { auth0_id },
      defaults: { name, email },
    });

    res.status(200).json({ user, created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sync user" });
  }
};

module.exports = { getUser, syncUser };
