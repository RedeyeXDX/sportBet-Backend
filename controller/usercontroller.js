const { User } = require("../db/models");

const getUserByAuth0Id = async (req, res) => {
  const { auth0_id } = req.params;

  try {
    const user = await User.findOne({
      where: { auth0_id },
      attributes: [
        "id",
        "username",
        "email",
        "balance",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getUserByAuth0Id,
};
