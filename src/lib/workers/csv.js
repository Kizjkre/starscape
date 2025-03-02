import * as d3 from 'd3';

self.onmessage = async event => {
  const csvUrl = event.data;
  try {
    const data = (await d3.csv(csvUrl))
      .filter(({ Hpmax }) => Hpmax.length > 0 && +Hpmax < 2);

    data.forEach(({ RAhms, DEdms, Plx }, i) => {
      // REF: https://math.stackexchange.com/a/1273714

      const [RAh, RAm, RAs] = RAhms.split(' ').map(v => +v);
      const [DEd, DEm, DEs] = DEdms.split(' ').map(v => +v);

      const a = RAh * 15 + RAm / 4 + RAs / 240;
      const b = (Math.abs(DEd) + DEm / 60 + DEs / 3600) * (DEd > 0 ? 1 : -1);
      const c = 1 / Plx;

      const x = c * Math.cos(b) * Math.cos(a);
      const y = c * Math.cos(b) * Math.sin(a);
      const z = c * Math.sin(b);

      data[i].x = x;
      data[i].y = y;
      data[i].z = z;
    });

    data.sort(({ Hpmax: m1 }, { Hpmax: m2 }) => !m1.length ? m2 : !m2.length ? m1 : +m1 - +m2);

    self.postMessage({ status: 'success', data });
  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
};
