export type NewsCategory =
  | 'Training +'
  | 'Training ++'
  | 'Training -'
  | 'Training --'
  | 'Skill +'
  | 'Skill -'
  | 'New contract'
  | 'Fans'
  | 'Juniors'
  | 'Forced sold player'
  | 'Retired'
  | 'Tired';

export class News {
  constructor(public category: NewsCategory, public data: string | number) {}
}

export class NewsList {
  news: News[];

  constructor(news: News[] = []) {
    this.news = news;
  }

  strList(): string[] {
    const templates: Array<{ category: NewsCategory; template: string }> = [
      { category: 'Training +', template: '{} trained well.' },
      { category: 'Training ++', template: '{} trained very well!' },
      { category: 'Training -', template: '{} trained badly.' },
      { category: 'Training --', template: '{} trained very badly.' },
      { category: 'Skill +', template: '{} improved skill!' },
      { category: 'Skill -', template: '{} decreased skill.' },
      { category: 'New contract', template: '{} demands a new contract!' },
      { category: 'Fans', template: 'Your fans {} your team\'s performance.' },
      { category: 'Juniors', template: '{} were promoted from your youth academy.' },
      { category: 'Forced sold player', template: '{} was sold by the board to balance your finances.' },
      { category: 'Retired', template: '{} has retired from playing football.' },
      { category: 'Tired', template: '{} is tired and needs 1 game to rest.' }
    ];

    const fanStrings = ['disliked', 'liked'];
    const order: NewsCategory[] = [
      'New contract',
      'Fans',
      'Training ++',
      'Training +',
      'Training -',
      'Training --',
      'Skill +',
      'Skill -',
      'Retired',
      'Juniors',
      'Forced sold player',
      'Tired'
    ];

    const formatted: string[] = [];

    for (const category of order) {
      let payload = '';
      const matching = this.news.filter((item) => item.category === category);
      if (matching.length) {
        if (category !== 'Fans') {
          matching.forEach((item, index) => {
            if (payload) {
              payload += index + 1 < matching.length ? ', ' : ' and ';
            }
            payload += String(item.data);
          });
        } else {
          const val = Number(matching[0].data);
          if (val <= -0.5) {
            payload = fanStrings[0];
          } else if (val >= 0.5) {
            payload = fanStrings[1];
          }
        }
      }
      if (payload) {
        const template = templates.find((entry) => entry.category === category);
        if (template) {
          formatted.push(template.template.replace('{}', payload));
        }
      }
    }

    return formatted;
  }
}
