import { UncleAvatar, MingAvatar, MomAvatar, DadAvatar } from '../components/DialoguePlayer/DialogueAvatars';

export const ROLE_CONFIG = {
  uncle: { name: '舅舅', align: 'left', bubbleColor: 'var(--g4-bubble-blue)', avatar: UncleAvatar },
  mom: { name: '妈妈', align: 'left', bubbleColor: 'var(--g4-bubble-blue)', avatar: MomAvatar },
  dad: { name: '爸爸', align: 'left', bubbleColor: 'var(--g4-bubble-blue)', avatar: DadAvatar },
  ming: { name: '小明', align: 'right', bubbleColor: 'var(--g4-bubble-orange)', avatar: MingAvatar },
};

export const DIALOGUE_MESSAGES = [
  { role: 'uncle', text: '@小明 你什么时候放暑假呀?' },
  { role: 'ming', text: '舅舅,我7月8号放暑假!' },
  { role: 'uncle', text: '这个假期有时间来成都看大熊猫吗?' },
  { role: 'ming', text: '好呀,我有时间!爸爸妈妈有时间陪我一起去吗?' },
  { role: 'mom', text: '没问题,我们可以选一个周末去,南充离成都不远。' },
  { role: 'dad', text: '7月27号怎么样?那天是周六,我们不用上班。' },
  { role: 'ming', text: '太好啦!那我来负责买火车票吧。' },
  { role: 'uncle', text: '记得到达站选择成都东站,那里交通方便。@小明' },
  { role: 'mom', text: '另外路上不要花太长时间,争取在18时30分前到成都东站。' },
];

export default DIALOGUE_MESSAGES;
