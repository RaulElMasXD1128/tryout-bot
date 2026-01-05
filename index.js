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

  const args = message.content.trim().split(/\s+/);

  // >phase 5 low weak @user [nota...]
  if (args.length < 5) {
    return message.reply(
      "❌ Uso correcto:\n`>phase (0–5) (low|mid|high) (weak|stable|strong) @usuario [nota opcional]`"
    );
  }

  const fase = args[1];
  const tier = args[2]?.toLowerCase();
  const state = args[3]?.toLowerCase();
  const member = message.mentions.members.first();

  const fasesValidas = ["0", "1", "2", "3", "4", "5"];
  const tierRoles = ["low", "mid", "high"];
  const stateRoles = ["weak", "stable", "strong"];

  if (!fasesValidas.includes(fase) ||
      !tierRoles.includes(tier) ||
      !stateRoles.includes(state) ||
      !member) {
    return message.reply(
      "❌ Uso correcto:\n`>phase (0–5) (low|mid|high) (weak|stable|strong) @usuario [nota opcional]`"
    );
  }

  // Nota opcional (todo después de la mención)
  const mentionIndex = args.findIndex(a => a.includes("<@"));
  const nota = mentionIndex !== -1
    ? args.slice(mentionIndex + 1).join(" ")
    : null;

  const rolesNombres = [`phase ${fase}`, tier, state];

  const phaseRegex = /^phase\s\d$/i;

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

  if (nota) {
    embed.addFields({
      name: "📝 Nota del tryouter",
      value: nota
    });
  }

  message.reply({ embeds: [embed] });
});

client.login(process.env.TOKEN);
