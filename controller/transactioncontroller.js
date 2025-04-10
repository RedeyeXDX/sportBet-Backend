const { User, Transaction } = require("../db/models");

const transactionRecord = async (req, res) => {
  const { auth0_id } = req.params;
  const { amount, type } = req.body;

  if (!amount || (type !== "add" && type !== "Withdraw")) {
    return res.status(400).json({ message: "Invalid request" });
  }
  try {
    const [user] = await User.findOrCreate({
      where: { auth0_id },
    });

    if (type === "Withdraw" && user.balance < amount) {
      return res
        .status(400)
        .json({ message: "Insufficient balance", balance: user.balance });
    }

    const newBalance =
      type === "add" ? user.balance + amount : user.balance - amount;

    // Update user balance
    user.balance = newBalance;
    await user.save();
    // Record the transaction
    const transaction = await Transaction.create({
      user_id: user.id,
      type,
      amount,
      description: `${type === "add" ? "Deposit" : "Withdrawal"} of $${amount}`,
      created_at: new Date(),
    });
    res.json({
      message: `Successfully ${
        type === "add" ? "deposited" : "withdrew"
      } $${amount}`,
      balance: user.balance,
    });
  } catch (error) {
    console.error("Transaction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserTransactions = async (req, res) => {
  const { auth0_id } = req.params;

  try {
    const user = await User.findOne({ where: { auth0_id } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await Transaction.findAll({
      where: { user_id: user.id },
      order: [["created_at", "DESC"]],
    });

    res.json(transactions);
  } catch (error) {
    console.error("Fetching transactions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { transactionRecord, getUserTransactions };
