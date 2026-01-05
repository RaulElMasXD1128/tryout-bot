const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(">phase")) return;

  const autorizado =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    message.member.roles.cache.some(r => r.name === "Tryout hoster");

  if (!autorizado)
    return message.reply("❌ No tienes permisos para evaluar.");

  const args = message.content.slice(1).split(" ");
  const member = message.mentions.members.first();
  if (!member) return message.reply("❌ Menciona a un jugador");

  let rolesNombres = [];
  let i = 0;

  while (i < args.length) {
    if (args[i].toLowerCase() === "phase" && args[i + 1]) {
      rolesNombres.push(`phase ${args[i + 1]}`);
      i += 2;
    } else {
      if (!args[i].startsWith("<@")) rolesNombres.push(args[i]);
      i++;
    }
  }

  const yaTiene = rolesNombres.every(nombre =>
    member.roles.cache.some(r => r.name.toLowerCase() === nombre.toLowerCase())
  );

  if (yaTiene)
    return message.reply(`${member} Ya tiene esa combinación de roles.`);

  const phaseRegex = /^phase\s\d$/i;
  const tierRoles = ["low", "mid", "strong"];
  const stateRoles = ["weak", "stable", "high"];

  const rolesAEliminar = member.roles.cache.filter(r =>
    phaseRegex.test(r.name) ||
    tierRoles.includes(r.name.toLowerCase()) ||
    stateRoles.includes(r.name.toLowerCase())
  );

  await member.roles.remove(rolesAEliminar);

  const rolesFinales = rolesNombres
    .map(nombre =>
      message.guild.roles.cache.find(
        r => r.name.toLowerCase() === nombre.toLowerCase()
      )
    )
    .filter(Boolean);

  await member.roles.add(rolesFinales);

  const hora = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const embed = new EmbedBuilder()
    .setColor("#3BA55D")
    .setAuthor({
      name: "Phase actualizada",
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(
      `Se otorgó **${rolesNombres.join(" ").toUpperCase()}** a ${member}`
    )
    .setFooter({
      text: `Evaluado por ${message.author.username} · hoy a las ${hora}`,
      iconURL: message.author.displayAvatarURL()
    });

  message.reply({ embeds: [embed] });
});


client.login(process.env.TOKEN);

