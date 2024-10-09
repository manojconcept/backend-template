import userModel from "../models/Users.js"

//listing down the all details of usernames.
export async function usersDetails(req, res) {
  try {
    const userData = await userModel.find().select('email role username -_id');
    const count = await userModel.countDocuments({}, { hint: "_id_" });
    if (count === 0) res.status(404).json({ message: 'no record found' });
    res.status(200).json([{
      totalusers: count,
      userdetails: userData
    }]);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

//Details perticular user name.
export async function userDetail(req, res) {
  const { username } = req.body;
  try {
    const data = await userModel.findOne({ username }).select('email role username -_id');
    if (!data) return res.status(404).json({ message: `${username} - no active record found` });
    return res.status(200).json(data);
  } catch(error) {
    res.status(500).json({ message: `Server error ${error.message}` });
  };
};


//should make the user as admin, after that it should work
export async function makeAdmin(req,res){
  const {username} = req.body;
  try{
    const data = await userModel.findOne({username});
    const dataBanned = await userModel.findOne({username,deleted:true});
    const userWithAdmin = await userModel.findOne({username,role:"admin"});
    if (userWithAdmin) return res.status(409).json({message:`${username} is already admin`})
    if(!data) return res.status(404).json({ message: `${username} - no active record found`});
    if(dataBanned) return res.status(403).json({message: `${username} - has been banned`}); 
    await userModel.updateOne({username},{$set:{role:"admin"}});
    return res.status(200).json({message:`user ${username} roled to admin`});

  }catch(error){
    res.status(500).json({message:`Server error ${error.message}`});
  }
}

//Banning the users
export async function banUser(req, res) {
  const { username } = req.params;
  try {
    const data = await userModel.findOne({ username, deleted: false });
    const banneddata = await userModel.findOne({ username, deleted: true });
    if (data) {
      await userModel.updateOne({ username }, { $set: { deleted: true } });
      return res.status(200).json({ message: `${username} is banned` });
    }

    if (banneddata) {
      return res.status(200).json({ message: `${username} is already banned` });
    }
    return res.status(404).json({ message: `${username} - no active record found` });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' + e.message });
  }
}

// Unbanning the users.
export async function unbanUser(req, res) {
  const { username } = req.params;
  try {
    const banneddata = await userModel.findOne({ username, deleted: true });
    const data = await userModel.findOne({ username, deleted: false });
    if (banneddata) {
      await userModel.updateOne({ username }, { $set: { deleted: false } });
      return res.status(200).json({ message: `${username} is unbanned` });
    }

    if (data) {
      return res.status(200).json({ message: `${username} is already unbanned` });
    }
    return res.status(404).json({ message: `${username} - no active record found` });
  } catch (e) {
    return res.status(500).json({ message: `Server error ${error.message} ${e.massage}` });
  }
}