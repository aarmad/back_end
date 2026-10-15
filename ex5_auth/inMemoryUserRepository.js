const bcrypt = require('bcryptjs');

const registeredUsers = [
    {
        email: 'john@test.com',
        password: bcrypt.hashSync('123456', 10)
    },
    {
        email: 'jane@test.com',
        password: bcrypt.hashSync('abcdef', 10)
    }
];

function getRegisteredUsers() {
    return registeredUsers;
}

async function checkCredentials(email, password) {
    const user = registeredUsers.find(
        u => u.email === email
    );

    if (!user) {
        return false;
    }

    return await bcrypt.compare(password, user.password);
}

async function newUserRegistered(email, password) {
    const existingUser = registeredUsers.find(
        u => u.email === email
    );

    if (existingUser) {
        return false;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    registeredUsers.push({
        email: email,
        password: hashedPassword
    });

    return true;
}

module.exports = {
    getRegisteredUsers,
    checkCredentials,
    newUserRegistered
};
