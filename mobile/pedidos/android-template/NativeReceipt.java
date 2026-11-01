package br.com.mostralo.pedidos;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Cupom do pedido montado no nativo (mesmo layout de src/lib/thermal/receipt.ts),
 * para o serviço imprimir sozinho quando a página do app está congelada ou fechada.
 * Modo "image" desenha o cupom e manda como bitmap (todos os acentos em qualquer térmica).
 */
public class NativeReceipt {

    /** Opções vindas da aba Impressora (PedidosService.configurePrinter). */
    public static class Options {
        public int paper = 58;
        public String codepage = "pc850";
        public boolean cutter = false;
        public int copies = 1;
        public String kitchenSize = "mid";
        public List<String> vias = new ArrayList<>(); // vazio = segue a loja
    }

    private static final int A_LEFT = 0, A_CENTER = 1, A_RIGHT = 2;
    private static final int S_NORMAL = 0, S_MID = 1, S_BIG = 2;

    /** Uma linha do cupom (ou avanço de papel / corte). */
    private static class Line {
        String text = "";
        int align = A_LEFT;
        boolean bold = false;
        int size = S_NORMAL;
        int feed = 0;
        boolean cut = false;
    }

    private final List<Line> lines = new ArrayList<>();
    private int align = A_LEFT;
    private boolean bold = false;
    private int size = S_NORMAL;

    private void line(String t) {
        Line l = new Line();
        l.text = t; l.align = align; l.bold = bold; l.size = size;
        lines.add(l);
    }
    private void feed(int n) { Line l = new Line(); l.feed = n; lines.add(l); }
    private void cut() { Line l = new Line(); l.cut = true; lines.add(l); }

    // ---------- texto ----------

    static String clean(String t) {
        if (t == null) return "";
        StringBuilder b = new StringBuilder();
        String s = Normalizer.normalize(t, Normalizer.Form.NFC);
        for (int i = 0; i < s.length(); ) {
            int cp = s.codePointAt(i);
            i += Character.charCount(cp);
            // emoji e símbolos que a térmica não tem
            if (cp > 0xFFFF || (cp >= 0x2600 && cp <= 0x27BF) || (cp >= 0xFE00 && cp <= 0xFE0F) || cp == 0x200D) continue;
            if (cp == 0x2013 || cp == 0x2014 || cp == 0x00B7 || cp == 0x2022) { b.append('-'); continue; }
            if (cp == 0x201C || cp == 0x201D) { b.append('"'); continue; }
            if (cp == 0x2018 || cp == 0x2019) { b.append('\''); continue; }
            if (cp == 0x00A0) { b.append(' '); continue; }
            b.appendCodePoint(cp);
        }
        return b.toString().trim();
    }

    static String stripAccents(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").replaceAll("[ºª°]", "o");
    }

    static List<String> wrap(String text, int width) {
        List<String> out = new ArrayList<>();
        for (String raw : text.split("\n", -1)) {
            int k = 0;
            while (k < raw.length() && raw.charAt(k) == ' ') k++;
            String indent = raw.substring(0, k);
            String line = indent;
            for (String word : raw.trim().split("\\s+")) {
                if (word.isEmpty()) continue;
                if (line.equals(indent)) line = indent + word;
                else if ((line + " " + word).length() <= width) line += " " + word;
                else { out.add(line); line = word; }
                while (line.length() > width) { out.add(line.substring(0, width)); line = line.substring(width); }
            }
            out.add(line);
        }
        return out;
    }

    static List<String> twoCols(String left, String right, int width) {
        int room = Math.max(width - right.length() - 1, 8);
        List<String> ls = wrap(left, room);
        String last = ls.remove(ls.size() - 1);
        StringBuilder b = new StringBuilder(last);
        while (b.length() < width - right.length()) b.append(' ');
        b.append(right);
        ls.add(b.toString());
        return ls;
    }

    static String brl(double v) {
        NumberFormat f = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
        return f.format(v).replace(' ', ' ').replace(' ', ' ');
    }

    static String dateTime(String iso) {
        if (iso == null || iso.length() < 19) return "";
        try {
            SimpleDateFormat in = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            in.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date d = in.parse(iso.substring(0, 19));
            // PostgREST devolve timestamptz em UTC (+00:00)
            SimpleDateFormat out = new SimpleDateFormat("dd/MM/yyyy HH:mm", new Locale("pt", "BR"));
            out.setTimeZone(TimeZone.getTimeZone("America/Sao_Paulo"));
            return out.format(d);
        } catch (Exception e) {
            return "";
        }
    }

    static String paymentText(String method, JSONObject details) {
        String card = details != null ? details.optString("card_type", "") : "";
        String base;
        if ("card".equals(method)) base = "debit".equals(card) ? "Cartão de débito" : "credit".equals(card) ? "Cartão de crédito" : "Cartão";
        else if ("pix".equals(method)) base = "Pix";
        else if ("cash".equals(method)) base = "Dinheiro";
        else if ("credit_card".equals(method)) base = "Cartão de crédito";
        else if ("debit_card".equals(method)) base = "Cartão de débito";
        else base = "Não informado";
        double change = 0;
        if (details != null) change = details.optDouble("change_for", details.optDouble("troco", details.optDouble("changeFor", 0)));
        if (Double.isNaN(change)) change = 0;
        return "cash".equals(method) && change > 0 ? base + " (troco para " + brl(change) + ")" : base;
    }

    // ---------- montagem (igual à página) ----------

    /** Monta os bytes ESC/POS do pedido a partir do JSON de app_device_order_receipt. */
    public static byte[] build(JSONObject data, Options opt) throws Exception {
        NativeReceipt r = new NativeReceipt();
        JSONObject o = data.getJSONObject("order");
        JSONArray items = data.optJSONArray("items");
        JSONArray addons = data.optJSONArray("addons");
        if (items == null) items = new JSONArray();
        if (addons == null) addons = new JSONArray();
        String storeName = data.optString("store_name", "Loja");
        JSONObject conf = data.optJSONObject("config");
        JSONObject sections = conf != null ? conf.optJSONObject("sections") : null;
        JSONObject texts = conf != null ? conf.optJSONObject("custom_texts") : null;
        JSONObject copiesCfg = conf != null ? conf.optJSONObject("print_copies") : null;
        String headerText = texts != null ? clean(texts.optString("headerText", "")) : "";
        String footerText = texts != null ? clean(texts.optString("footerText", "")) : "";

        List<String> vias = new ArrayList<>(opt.vias);
        if (vias.isEmpty() && copiesCfg != null) {
            for (String v : new String[] { "complete", "kitchen", "delivery" }) if (copiesCfg.optBoolean(v, false)) vias.add(v);
        }
        if (vias.isEmpty()) vias.add("complete");

        int w = opt.paper == 80 ? 48 : 32;
        String sep = new String(new char[w]).replace('\0', '-');
        boolean cutter = opt.cutter;
        int copies = Math.max(1, opt.copies);
        String delivery = o.optString("delivery_type", "");
        String notes = clean(o.optString("notes", ""));
        if ("null".equals(notes)) notes = "";

        for (int c = 0; c < copies; c++) {
            for (int vi = 0; vi < vias.size(); vi++) {
                String via = vias.get(vi);
                if (vias.size() > 1) { r.align = A_CENTER; r.bold = true; r.line("=== VIA " + ("kitchen".equals(via) ? "COZINHA" : "delivery".equals(via) ? "ENTREGADOR" : "COMPLETA") + " ==="); r.bold = false; }

                if (on(sections, "header")) {
                    r.align = A_CENTER; r.bold = true; r.line(clip(storeName, w)); r.bold = false;
                    if (!headerText.isEmpty()) for (String l : wrap(headerText, w)) r.line(l);
                }
                r.align = A_CENTER; r.size = S_BIG; r.bold = true; r.line("PEDIDO #" + o.optString("order_number")); r.size = S_NORMAL; r.bold = false;
                if (on(sections, "orderInfo")) {
                    r.line("delivery".equals(delivery) ? "ENTREGA" : "RETIRADA");
                    String sched = o.isNull("scheduled_for") ? "" : o.optString("scheduled_for", "");
                    if (!sched.isEmpty()) { r.bold = true; r.line("ENCOMENDA"); r.line("Para: " + dateTime(sched)); r.bold = false; }
                    r.line("Feito em: " + dateTime(o.optString("created_at")));
                }
                r.align = A_LEFT; r.line(sep);

                String name = str(o, "customer_name"), phone = str(o, "customer_phone"), addr = str(o, "customer_address");
                if ("delivery".equals(via)) {
                    if (!name.isEmpty()) for (String l : wrap("Cliente: " + name, w)) r.line(l);
                    if (!addr.isEmpty()) { r.bold = true; r.line("ENDEREÇO DE ENTREGA:"); for (String l : wrap(addr, w)) r.line(l); r.bold = false; }
                    r.line(sep);
                } else if (on(sections, "customerInfo")) {
                    if (!name.isEmpty()) for (String l : wrap("Cliente: " + name, w)) r.line(l);
                    if (!phone.isEmpty()) r.line("Tel: " + phone);
                    if (!addr.isEmpty()) for (String l : wrap("End: " + addr, w)) r.line(l);
                    r.line(sep);
                }

                if (on(sections, "items")) {
                    for (int i = 0; i < items.length(); i++) {
                        JSONObject it = items.getJSONObject(i);
                        int qty = it.optInt("quantity", 1);
                        double sub = it.optDouble("subtotal", 0);
                        String pname = clean(it.optString("product_name", ""));
                        String inotes = it.isNull("notes") ? "" : clean(it.optString("notes", ""));
                        List<JSONObject> its = new ArrayList<>();
                        for (int a = 0; a < addons.length(); a++) { JSONObject ad = addons.getJSONObject(a); if (it.optString("id").equals(ad.optString("order_item_id"))) its.add(ad); }
                        if ("kitchen".equals(via)) {
                            String ks = opt.kitchenSize;
                            r.bold = true; r.size = "big".equals(ks) ? S_BIG : "mid".equals(ks) ? S_MID : S_NORMAL;
                            for (String l : wrap(qty + "x " + pname, "big".equals(ks) ? w / 2 : w)) r.line(l);
                            r.size = S_NORMAL;
                            for (JSONObject ad : its) for (String l : wrap("  + " + ad.optInt("quantity", 1) + "x " + clean(ad.optString("addon_name")), w)) r.line(l);
                            if (!inotes.isEmpty()) for (String l : wrap("  >> OBS: " + inotes, w)) r.line(l);
                            r.bold = false;
                        } else if ("delivery".equals(via)) {
                            for (String l : wrap(qty + "x " + pname, w)) r.line(l);
                        } else {
                            r.bold = true; for (String l : twoCols(qty + "x " + pname, brl(sub), w)) r.line(l); r.bold = false;
                            if (qty > 1) r.line("  " + brl(sub / qty) + " x " + qty);
                            for (JSONObject ad : its) {
                                int aq = ad.optInt("quantity", 1);
                                double as = ad.optDouble("subtotal", 0);
                                for (String l : twoCols("  + " + (aq > 1 ? aq + "x " : "") + clean(ad.optString("addon_name")), as > 0 ? brl(as) : "", w)) r.line(l);
                            }
                            if (!inotes.isEmpty()) for (String l : wrap("  Obs: " + inotes, w)) r.line(l);
                        }
                    }
                    r.line(sep);
                }

                if (on(sections, "totals") && !"kitchen".equals(via)) {
                    double total = o.optDouble("total", 0);
                    if ("delivery".equals(via)) {
                        r.align = A_CENTER; r.bold = true; r.line("TOTAL A RECEBER"); r.size = S_BIG; r.line(brl(total)); r.size = S_NORMAL; r.bold = false; r.align = A_LEFT;
                    } else {
                        double subtotal = o.isNull("subtotal") ? total : o.optDouble("subtotal", total);
                        for (String l : twoCols("Subtotal", brl(subtotal), w)) r.line(l);
                        double fee = o.optDouble("delivery_fee", 0), disc = o.optDouble("promotion_discount", 0);
                        if (fee > 0) for (String l : twoCols("Taxa de entrega", brl(fee), w)) r.line(l);
                        if (disc > 0) for (String l : twoCols("Desconto", "-" + brl(disc), w)) r.line(l);
                        r.bold = true; r.size = S_BIG; for (String l : twoCols("TOTAL", brl(total), w / 2)) r.line(l); r.size = S_NORMAL; r.bold = false;
                    }
                    r.line(sep);
                }

                if (!notes.isEmpty() && !"delivery".equals(via)) {
                    r.bold = true; r.line("OBSERVAÇÕES DO PEDIDO:"); r.bold = false;
                    for (String l : wrap(notes, w)) r.line(l);
                    r.line(sep);
                }

                if (on(sections, "payment") && !"kitchen".equals(via)) {
                    for (String l : wrap("Pagamento: " + paymentText(o.optString("payment_method"), o.optJSONObject("payment_details")), w)) r.line(l);
                    String ps = str(o, "payment_status");
                    if (!ps.isEmpty()) r.line("Status: " + ("paid".equals(ps) ? "Pago" : "Pendente"));
                    r.line(sep);
                }

                r.align = A_CENTER;
                if (on(sections, "footer") && !footerText.isEmpty()) for (String l : wrap(footerText, w)) r.line(l);
                r.line("MOSTRALO - mostralo.com.br");
                r.feed(vi == vias.size() - 1 ? 3 : 2);
                if (cutter) r.cut();
                r.align = A_LEFT;
            }
        }
        return "image".equals(opt.codepage) ? r.toRaster(opt.paper) : r.toText(opt.codepage);
    }

    private static boolean on(JSONObject sections, String k) { return sections == null || sections.optBoolean(k, true); }
    private static String clip(String s, int w) { return s.length() > w ? s.substring(0, w) : s; }
    private static String str(JSONObject o, String k) { return o.isNull(k) ? "" : clean(o.optString(k, "")); }

    // ---------- saída em texto ESC/POS ----------

    private byte[] toText(String cp) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0x1B); out.write(0x40);
        String charset = null;
        int n = -1;
        switch (cp == null ? "pc850" : cp) {
            case "pc860": charset = "IBM860"; n = 3; break;
            case "wpc1252": charset = "windows-1252"; n = 16; break;
            case "pc437": charset = "IBM437"; n = 0; break;
            case "none": break;
            default: charset = "IBM850"; n = 2;
        }
        Charset cs = null;
        try { if (charset != null) cs = Charset.forName(charset); } catch (Exception ignored) { cs = null; }
        out.write(0x1C); out.write(0x2E); // desliga o modo chinês
        if (cs != null) { out.write(0x1B); out.write(0x74); out.write(n); }
        for (Line l : lines) {
            if (l.cut) { out.write(0x1D); out.write(0x56); out.write(0x42); out.write(0); continue; }
            if (l.feed > 0) { out.write(0x1B); out.write(0x64); out.write(l.feed); continue; }
            out.write(0x1B); out.write(0x61); out.write(l.align);
            out.write(0x1B); out.write(0x45); out.write(l.bold ? 1 : 0);
            out.write(0x1D); out.write(0x21); out.write(l.size == S_BIG ? 0x11 : l.size == S_MID ? 0x01 : 0x00);
            String t = cs == null ? stripAccents(l.text) : l.text;
            byte[] b;
            try { b = cs == null ? t.getBytes("US-ASCII") : t.getBytes(cs); } catch (Exception e) { b = stripAccents(t).getBytes(); }
            out.write(b, 0, b.length);
            out.write('\n');
        }
        out.write(0x1D); out.write(0x21); out.write(0);
        return out.toByteArray();
    }

    // ---------- saída em imagem (GS v 0) ----------

    private byte[] toRaster(int paper) {
        int width = paper == 80 ? 576 : 384;
        int cols = paper == 80 ? 48 : 32;
        float charW = width / (float) cols;
        float fontPx = charW / 0.6f;
        int lineH = Math.round(fontPx * 1.15f);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0x1B); out.write(0x40);
        List<Line> block = new ArrayList<>();
        for (Line l : lines) {
            if (l.cut) { drawBlock(block, width, fontPx, lineH, out); block.clear(); out.write(0x1D); out.write(0x56); out.write(0x42); out.write(0); }
            else block.add(l);
        }
        drawBlock(block, width, fontPx, lineH, out);
        return out.toByteArray();
    }

    private static void drawBlock(List<Line> block, int width, float fontPx, int lineH, ByteArrayOutputStream out) {
        int height = 0;
        for (Line l : block) height += l.feed > 0 ? l.feed * lineH : (l.size != S_NORMAL ? lineH * 2 : lineH);
        if (height <= 0) return;
        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(bmp);
        cv.drawColor(Color.WHITE);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(Color.BLACK);
        int y = 0;
        for (Line l : block) {
            if (l.feed > 0) { y += l.feed * lineH; continue; }
            float sizePx = l.size == S_BIG ? fontPx * 2 : fontPx;
            p.setTypeface(Typeface.create(Typeface.MONOSPACE, l.bold ? Typeface.BOLD : Typeface.NORMAL));
            p.setTextSize(sizePx);
            p.setFakeBoldText(l.bold);
            float tw = p.measureText(l.text);
            float sx = tw > width ? width / tw : 1f;
            float sy = l.size == S_MID ? 2f : 1f;
            float x = l.align == A_CENTER ? (width - tw * sx) / 2f : l.align == A_RIGHT ? width - tw * sx : 0f;
            Paint.FontMetrics fm = p.getFontMetrics();
            cv.save();
            cv.translate(Math.max(0, x), y + (l.size != S_NORMAL ? 2 : 1));
            cv.scale(sx, sy);
            cv.drawText(l.text, 0, -fm.ascent, p);
            cv.restore();
            y += l.size != S_NORMAL ? lineH * 2 : lineH;
        }
        int bytesPerRow = (width + 7) / 8;
        int[] px = new int[width];
        for (int y0 = 0; y0 < height; y0 += 128) {
            int rows = Math.min(128, height - y0);
            out.write(0x1D); out.write(0x76); out.write(0x30); out.write(0);
            out.write(bytesPerRow & 0xFF); out.write((bytesPerRow >> 8) & 0xFF);
            out.write(rows & 0xFF); out.write((rows >> 8) & 0xFF);
            for (int yy = y0; yy < y0 + rows; yy++) {
                bmp.getPixels(px, 0, width, 0, yy, width, 1);
                for (int bx = 0; bx < bytesPerRow; bx++) {
                    int b = 0;
                    for (int bit = 0; bit < 8; bit++) {
                        int xx = bx * 8 + bit;
                        if (xx >= width) continue;
                        int c = px[xx];
                        int lum = (int) (Color.red(c) * 0.299 + Color.green(c) * 0.587 + Color.blue(c) * 0.114);
                        if (lum < 140) b |= 0x80 >> bit;
                    }
                    out.write(b);
                }
            }
        }
        bmp.recycle();
    }
}
